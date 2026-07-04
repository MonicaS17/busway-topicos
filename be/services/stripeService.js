const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function crearCliente(usuario) {
  const customer = await stripe.customers.create({
    email: usuario.correo,
    name: `${usuario.nombre} ${usuario.apellido}`,
    metadata: {
      busway_user_id: usuario._id.toString(),
      firebase_uid: usuario.firebase_uid,
    },
  });
  return customer;
}

async function crearSetupIntent(customerId) {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
  return setupIntent;
}

async function adjuntarMetodoPago(customerId, paymentMethodId, acuerdo) {
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const ultimos4 = paymentMethod.card.last4;

  acuerdo.stripe_customer_id = customerId;
  acuerdo.ultimos_4_digitos = ultimos4;
  await acuerdo.save();

  return { ultimos4 };
}

async function crearSuscripcion(customerId, paymentMethodId, acuerdo) {
  const tarifaPrice = await stripe.prices.create({
    unit_amount: Math.round(acuerdo.tarifa_mensual * 100),
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: {
      name: 'Tarifa mensual - BusWay',
      metadata: { type: 'conductor_tariff' },
    },
  });

  const membresiaPrice = await stripe.prices.create({
    unit_amount: Math.round(acuerdo.membresia * 100),
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: {
      name: 'Membresía BusWay',
      metadata: { type: 'membership' },
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    default_payment_method: paymentMethodId,
    items: [
      { price: tarifaPrice.id },
      { price: membresiaPrice.id },
    ],
    metadata: {
      acuerdo_id: acuerdo._id.toString(),
      padre_id: acuerdo.padre_id.toString(),
      conductor_id: acuerdo.conductor_id.toString(),
    },
    off_session: true,
  });

  acuerdo.stripe_subscription_id = subscription.id;
  await acuerdo.save();

  return subscription;
}

async function cancelarSuscripcion(subscriptionId) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

async function procesarEventoWebhook(event) {
  const Acuerdo = require('../models/Acuerdo');
  const Pago = require('../models/Pago');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const acuerdoId = session.metadata?.acuerdo_id;
      if (!acuerdoId) {
        console.log('checkout.session.completed sin acuerdo_id en metadata');
        break;
      }
      const acuerdo = await Acuerdo.findById(acuerdoId);
      if (!acuerdo) {
        console.error(`Acuerdo ${acuerdoId} no encontrado`);
        break;
      }

      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      if (subscriptionId) {
        acuerdo.stripe_subscription_id = subscriptionId;
        acuerdo.stripe_customer_id = customerId || acuerdo.stripe_customer_id;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (subscription.default_payment_method) {
            const pmId = typeof subscription.default_payment_method === 'string'
              ? subscription.default_payment_method
              : subscription.default_payment_method.id;
            const pm = await stripe.paymentMethods.retrieve(pmId);
            if (pm.card?.last4) {
              acuerdo.ultimos_4_digitos = pm.card.last4;
            }
          }
        } catch (err) {
          console.error('Error obteniendo detalles de suscripción:', err.message);
        }

        await acuerdo.save();
        console.log(`Acuerdo ${acuerdoId} vinculado a subscription ${subscriptionId}`);
      }
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object;
      const acuerdoId = subscription.metadata?.acuerdo_id;
      if (!acuerdoId) break;
      const acuerdo = await Acuerdo.findById(acuerdoId);
      if (!acuerdo) break;
      if (!acuerdo.stripe_subscription_id) {
        acuerdo.stripe_subscription_id = subscription.id;
        if (subscription.customer) {
          acuerdo.stripe_customer_id = typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        }
        await acuerdo.save();
        console.log(`Subscription ${subscription.id} vinculada a acuerdo ${acuerdoId}`);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const paymentIntentId = invoice.payment_intent;

      const acuerdo = await Acuerdo.findOne({ stripe_subscription_id: subscriptionId });
      if (!acuerdo) {
        console.error(`Acuerdo no encontrado para subscription ${subscriptionId}`);
        return;
      }

      const pagoExistente = await Pago.findOne({ stripe_payment_id: paymentIntentId });
      if (pagoExistente) {
        console.log(`Pago ya registrado para invoice ${invoice.id}`);
        return;
      }

      const totalAmount = invoice.amount_paid / 100;
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
        stripe_payment_id: paymentIntentId,
        mes_contrato: acuerdo.mes_actual,
        fecha: new Date(),
      });

      acuerdo.mes_actual += 1;
      if (acuerdo.mes_actual > acuerdo.total_meses) {
        acuerdo.estado = 'finalizado';
      }
      await acuerdo.save();

      console.log(`Pago registrado exitosamente para acuerdo ${acuerdo._id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const paymentIntentId = invoice.payment_intent;

      const acuerdo = await Acuerdo.findOne({ stripe_subscription_id: subscriptionId });
      if (!acuerdo) break;

      await Pago.create({
        acuerdo_id: acuerdo._id,
        padre_id: acuerdo.padre_id,
        conductor_id: acuerdo.conductor_id,
        monto_total: invoice.amount_due / 100,
        tarifa_conductor: acuerdo.tarifa_mensual,
        membresia: acuerdo.membresia,
        estado: 'Fallido',
        stripe_payment_id: paymentIntentId,
        mes_contrato: acuerdo.mes_actual,
        fecha: new Date(),
      });

      console.log(`Pago fallido registrado para acuerdo ${acuerdo._id}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const acuerdo = await Acuerdo.findOne({ stripe_subscription_id: subscription.id });
      if (acuerdo) {
        acuerdo.estado = 'cancelado';
        await acuerdo.save();
      }
      break;
    }

    default:
      console.log(`Evento webhook no manejado: ${event.type}`);
  }
}

module.exports = {
  crearCliente,
  crearSetupIntent,
  adjuntarMetodoPago,
  crearSuscripcion,
  cancelarSuscripcion,
  procesarEventoWebhook,
};
