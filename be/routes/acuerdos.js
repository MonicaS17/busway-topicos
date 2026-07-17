const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Acuerdo = require('../models/Acuerdo');
const Usuario = require('../models/Usuario');

async function obtenerUsuario(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return null;
  }
  return usuario;
}

// GET /api/acuerdos/mis-acuerdos — Padre obtiene su acuerdo activo
router.get('/mis-acuerdos', verifyToken, async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req, res);
    if (!usuario) return;
    if (usuario.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    let acuerdos = await Acuerdo.find({ padre_id: usuario._id, estado: 'activo' })
      .populate('conductor_id', 'nombre apellido correo foto_perfil')
      .populate({
        path: 'solicitud_id',
        select: 'escuela hijos_ids',
        populate: { path: 'hijos_ids', select: 'nombre' },
      });

    // --- AUTOCURACIÓN LOCAL PARA TODOS LOS ACUERDOS ---
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const Pago = require('../models/Pago');

    for (let i = 0; i < acuerdos.length; i++) {
      let acuerdo = acuerdos[i];
      if (!acuerdo.stripe_subscription_id) {
        console.log(`[Self-Healing] Detectado acuerdo activo ${acuerdo._id} sin Stripe Subscription. Verificando en Stripe...`);
        try {
          const sessions = await stripe.checkout.sessions.list({ limit: 15 });
          const sessionCompleta = sessions.data.find(s => 
            s.metadata?.acuerdo_id === acuerdo._id.toString() && 
            (s.payment_status === 'paid' || s.status === 'complete')
          );

          if (sessionCompleta) {
            console.log(`[Self-Healing] ¡Sesión de Stripe completada encontrada! Sincronizando...`);
            const customerId = sessionCompleta.customer;
            const subscriptionId = sessionCompleta.subscription;
            
            acuerdo.stripe_subscription_id = subscriptionId;
            acuerdo.stripe_customer_id = customerId;
            
            if (subscriptionId) {
              try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                if (subscription.default_payment_method) {
                  const pm = await stripe.paymentMethods.retrieve(subscription.default_payment_method);
                  if (pm.card?.last4) {
                    acuerdo.ultimos_4_digitos = pm.card.last4;
                  }
                }
              } catch (pmErr) {
                console.error('[Self-Healing] Error obteniendo método de pago:', pmErr.message);
              }
            }
            
            await acuerdo.save();
            
            // Crear pago inicial si no existe
            let paymentIntentId = sessionCompleta.payment_intent;
            if (!paymentIntentId && subscriptionId) {
              const invoices = await stripe.invoices.list({ subscription: subscriptionId, limit: 1 });
              if (invoices.data.length > 0) {
                paymentIntentId = invoices.data[0].payment_intent || invoices.data[0].id;
              }
            }
            
            const keyForPayment = paymentIntentId || `simulated_${Date.now()}`;
            const pagoExistente = await Pago.findOne({ stripe_payment_id: keyForPayment });
            
            if (!pagoExistente) {
              const totalAmount = sessionCompleta.amount_total ? (sessionCompleta.amount_total / 100) : (acuerdo.tarifa_mensual + acuerdo.membresia);
              const tarifaConductor = acuerdo.tarifa_mensual;
              const membresia = totalAmount - tarifaConductor;
              
              await Pago.create({
                acuerdo_id: acuerdo._id,
                padre_id: acuerdo.padre_id,
                conductor_id: acuerdo.conductor_id,
                monto_total: totalAmount,
                tarifa_conductor: tarifaConductor,
                membresia: membresia,
                estado: 'Exitoso',
                stripe_payment_id: keyForPayment,
                mes_contrato: acuerdo.mes_actual,
                fecha: new Date(),
              });
              
              const totalPagos = await Pago.countDocuments({ acuerdo_id: acuerdo._id, estado: 'Exitoso' });
              acuerdo.mes_actual = totalPagos;
              await acuerdo.save();
              console.log(`[Self-Healing] Pago inicial creado y mes incrementado para acuerdo ${acuerdo._id}`);
            }
            
            // Recargar acuerdo
            acuerdos[i] = await Acuerdo.findById(acuerdo._id)
              .populate('conductor_id', 'nombre apellido correo foto_perfil')
              .populate({
                path: 'solicitud_id',
                select: 'escuela hijos_ids',
                populate: { path: 'hijos_ids', select: 'nombre' },
              });
          }
        } catch (stripeErr) {
          console.error('[Self-Healing] Error consultando Stripe:', stripeErr.message);
        }
      }
    }

    res.json({ acuerdo: acuerdos[0] || null, acuerdos });
  } catch (error) {
    console.error('Error obteniendo acuerdos:', error);
    res.status(500).json({ error: 'Error interno al obtener tus acuerdos' });
  }
});

// GET /api/acuerdos/conductores — Conductor obtiene sus acuerdos activos
router.get('/conductores', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const acuerdos = await Acuerdo.find({ conductor_id: conductor._id, estado: 'activo' })
      .populate('padre_id', 'nombre apellido correo')
      .populate({
        path: 'solicitud_id',
        select: 'escuela hijos_ids',
        populate: { path: 'hijos_ids', select: 'nombre' },
      })
      .sort({ createdAt: -1 });

    res.json({ acuerdos, total: acuerdos.length });
  } catch (error) {
    console.error('Error obteniendo acuerdos del conductor:', error);
    res.status(500).json({ error: 'Error interno al obtener los acuerdos' });
  }
});

module.exports = router;
