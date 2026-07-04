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

router.post('/create-checkout-session', verifyToken, async (req, res) => {
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

    const successUrl = `${process.env.APP_SCHEME || 'busway'}://checkout-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.APP_SCHEME || 'busway'}://checkout-cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: usuario.stripe_customer_id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        { price: tarifaPriceId, quantity: 1 },
        { price: membresiaPriceId, quantity: 1 },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
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

    res.json({
      status: session.status,             // 'complete' | 'open' | 'expired'
      payment_status: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Error al verificar la sesión de pago' });
  }
});

module.exports = router;
