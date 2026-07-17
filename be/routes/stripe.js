const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Usuario = require('../models/Usuario');
const Acuerdo = require('../models/Acuerdo');
const stripeService = require('../services/stripeService');

router.post('/create-setup-intent', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { acuerdoId } = req.body;
    let acuerdo;
    if (acuerdoId) {
      acuerdo = await Acuerdo.findOne({
        _id: acuerdoId,
        padre_id: usuario._id,
        estado: 'activo'
      });
    } else {
      acuerdo = await Acuerdo.findOne({
        padre_id: usuario._id,
        estado: 'activo',
      });
    }
    if (!acuerdo) {
      return res.status(400).json({
        error: 'No tienes un contrato activo. Debes tener un acuerdo aceptado primero.',
      });
    }

    if (!usuario.stripe_customer_id) {
      const customer = await stripeService.crearCliente(usuario);
      usuario.stripe_customer_id = customer.id;
      await usuario.save();
    }

    const setupIntent = await stripeService.crearSetupIntent(usuario.stripe_customer_id);

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: usuario.stripe_customer_id,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Error al iniciar el registro de tarjeta' });
  }
});

router.post('/attach-payment', verifyToken, async (req, res) => {
  try {
    const { paymentMethodId, acuerdoId } = req.body;
    if (!paymentMethodId || !acuerdoId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!usuario.stripe_customer_id) {
      return res.status(400).json({ error: 'Primero debes iniciar el registro de tarjeta' });
    }

    const acuerdo = await Acuerdo.findById(acuerdoId);
    if (!acuerdo) return res.status(404).json({ error: 'Acuerdo no encontrado' });

    const { ultimos4 } = await stripeService.adjuntarMetodoPago(
      usuario.stripe_customer_id,
      paymentMethodId,
      acuerdo
    );

    if (!acuerdo.stripe_subscription_id) {
      await stripeService.crearSuscripcion(
        usuario.stripe_customer_id,
        paymentMethodId,
        acuerdo
      );
    }

    res.json({
      success: true,
      ultimos4,
      message: 'Método de pago registrado y suscripción activada exitosamente',
    });
  } catch (error) {
    console.error('Error attaching payment:', error);
    res.status(500).json({ error: 'Error al registrar el método de pago' });
  }
});

router.post('/cancel-subscription', verifyToken, async (req, res) => {
  try {
    const { acuerdoId } = req.body;
    if (!acuerdoId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const acuerdo = await Acuerdo.findById(acuerdoId);
    if (!acuerdo) return res.status(404).json({ error: 'Acuerdo no encontrado' });

    // Verificar que sea el padre o el conductor de este acuerdo
    if (acuerdo.padre_id.toString() !== usuario._id.toString() && acuerdo.conductor_id.toString() !== usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes autorización para cancelar este contrato' });
    }

    if (acuerdo.stripe_subscription_id) {
      try {
        await stripeService.cancelarSuscripcion(acuerdo.stripe_subscription_id);
      } catch (stripeErr) {
        console.error('Error cancelando en Stripe:', stripeErr.message);
      }
    }

    acuerdo.estado = 'cancelado';
    await acuerdo.save();

    // Desvincular estudiantes del conductor y cancelar la solicitud
    if (acuerdo.solicitud_id) {
      const Solicitud = require('../models/Solicitud');
      const Estudiante = require('../models/Estudiante');
      
      const solicitud = await Solicitud.findById(acuerdo.solicitud_id);
      if (solicitud) {
        solicitud.estado = 'rechazada';
        await solicitud.save();

        if (solicitud.hijos_ids && solicitud.hijos_ids.length > 0) {
          await Estudiante.updateMany(
            { _id: { $in: solicitud.hijos_ids } },
            { $unset: { conductor_id: "", ruta_id: "" } }
          );
        }
      }
    }

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Error al cancelar la suscripción' });
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await stripeService.procesarEventoWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { acuerdoId } = req.body;
    let acuerdo;
    if (acuerdoId) {
      acuerdo = await Acuerdo.findOne({
        _id: acuerdoId,
        padre_id: usuario._id,
        estado: 'activo'
      });
    } else {
      acuerdo = await Acuerdo.findOne({
        padre_id: usuario._id,
        estado: 'activo',
      });
    }
    if (!acuerdo) {
      return res.status(400).json({
        error: 'No tienes un contrato activo. Debes tener un acuerdo aceptado primero.',
      });
    }

    if (!usuario.stripe_customer_id) {
      const customer = await stripeService.crearCliente(usuario);
      usuario.stripe_customer_id = customer.id;
      await usuario.save();
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    let tarifaPriceId = acuerdo.stripe_tarifa_price_id;
    let membresiaPriceId = acuerdo.stripe_membresia_price_id;

    if (!tarifaPriceId) {
      const tarifaPrice = await stripe.prices.create({
        unit_amount: Math.round(acuerdo.tarifa_mensual * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: 'Tarifa mensual - BusWay',
          metadata: { type: 'conductor_tariff', acuerdo_id: acuerdo._id.toString() },
        },
      });
      tarifaPriceId = tarifaPrice.id;
      acuerdo.stripe_tarifa_price_id = tarifaPriceId;
    }

    if (!membresiaPriceId) {
      const membresiaPrice = await stripe.prices.create({
        unit_amount: Math.round(acuerdo.membresia * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: 'Membresía BusWay',
          metadata: { type: 'membership', acuerdo_id: acuerdo._id.toString() },
        },
      });
      membresiaPriceId = membresiaPrice.id;
      acuerdo.stripe_membresia_price_id = membresiaPriceId;
    }

    await acuerdo.save();

    const { success_url, cancel_url } = req.body;
    let finalSuccessUrl = success_url || `${process.env.APP_SCHEME || 'busway'}://checkout-success?session_id={CHECKOUT_SESSION_ID}`;
    if (success_url) {
      if (finalSuccessUrl.includes('?')) {
        finalSuccessUrl += '&session_id={CHECKOUT_SESSION_ID}';
      } else {
        finalSuccessUrl += '?session_id={CHECKOUT_SESSION_ID}';
      }
    }
    const finalCancelUrl = cancel_url || `${process.env.APP_SCHEME || 'busway'}://checkout-cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: usuario.stripe_customer_id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        { price: tarifaPriceId, quantity: 1 },
        { price: membresiaPriceId, quantity: 1 },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        acuerdo_id: acuerdo._id.toString(),
        padre_id: acuerdo.padre_id.toString(),
        conductor_id: acuerdo.conductor_id.toString(),
      },
      subscription_data: {
        metadata: {
          acuerdo_id: acuerdo._id.toString(),
          padre_id: acuerdo.padre_id.toString(),
          conductor_id: acuerdo.conductor_id.toString(),
        },
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error al crear la sesión de pago' });
  }
});

// Verifica el estado de una Checkout Session después del redirect del deep link
router.get('/checkout-status', verifyToken, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'Falta session_id' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // --- FALLBACK LOCAL: Si la sesión está completada y pagada, pero el acuerdo no está actualizado, actualízalo aquí mismo ---
    if ((session.payment_status === 'paid' || session.status === 'complete') && session.metadata?.acuerdo_id) {
      const acuerdoId = session.metadata.acuerdo_id;
      const agreement = await Acuerdo.findById(acuerdoId);
      
      if (agreement && !agreement.stripe_subscription_id) {
        console.log(`[Local Fallback] Sincronizando acuerdo ${acuerdoId} y creando pago inicial`);
        
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        agreement.stripe_subscription_id = subscriptionId;
        agreement.stripe_customer_id = customerId;
        
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            if (subscription.default_payment_method) {
              const pm = await stripe.paymentMethods.retrieve(subscription.default_payment_method);
              if (pm.card?.last4) {
                agreement.ultimos_4_digitos = pm.card.last4;
                agreement.marca_tarjeta = pm.card.brand;
              }
            }
          } catch (err) {
            console.error('[Local Fallback] Error obteniendo método de pago:', err.message);
          }
        }
        
        await agreement.save();
        
        // Crear el pago inicial en la base de datos si no existe
        const Pago = require('../models/Pago');
        let paymentIntentId = session.payment_intent;
        if (!paymentIntentId && subscriptionId) {
          try {
            const invoices = await stripe.invoices.list({ subscription: subscriptionId, limit: 1 });
            if (invoices.data.length > 0) {
              paymentIntentId = invoices.data[0].payment_intent || invoices.data[0].id;
            }
          } catch (err) {
            console.error('[Local Fallback] Error listando invoices:', err.message);
          }
        }
        
        const keyForPayment = paymentIntentId || `simulated_${Date.now()}`;
        const pagoExistente = await Pago.findOne({ stripe_payment_id: keyForPayment });
        
        if (!pagoExistente) {
          const totalAmount = session.amount_total ? (session.amount_total / 100) : (agreement.tarifa_mensual + agreement.membresia);
          const tarifaConductor = agreement.tarifa_mensual;
          const membresia = totalAmount - tarifaConductor;
          
          await Pago.create({
            acuerdo_id: agreement._id,
            padre_id: agreement.padre_id,
            conductor_id: agreement.conductor_id,
            monto_total: totalAmount,
            tarifa_conductor: tarifaConductor,
            membresia: membresia,
            estado: 'Exitoso',
            stripe_payment_id: keyForPayment,
            mes_contrato: agreement.mes_actual,
            fecha: new Date(),
          });
          
          const totalPagos = await Pago.countDocuments({ acuerdo_id: agreement._id, estado: 'Exitoso' });
          agreement.mes_actual = totalPagos;
          await agreement.save();
          console.log(`[Local Fallback] Pago inicial creado y mes incrementado para acuerdo ${agreement._id}`);
        }
      }
    }
    // ---------------------------------------------------------------------------------------------------------------

    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Error al verificar la sesión de pago' });
  }
});

module.exports = router;
