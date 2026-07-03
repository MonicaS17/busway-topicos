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

    const acuerdo = await Acuerdo.findOne({
      padre_id: usuario._id,
      estado: 'activo',
    });
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

    if (acuerdo.stripe_subscription_id) {
      await stripeService.cancelarSuscripcion(acuerdo.stripe_subscription_id);
    }

    acuerdo.estado = 'cancelado';
    await acuerdo.save();

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

module.exports = router;
