const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('Body received:', req.body);
    
    const amount = req.body?.amount || req.query?.amount;
    const currency = req.body?.currency || 'tnd';

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: currency,
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post('/calculate-shipping', async (req, res) => {
  try {
    const { weight, addressTo } = req.body;
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address_from: {
          name: 'FitSense Store',
          street1: 'Rue de la République',
          city: 'Tunis',
          country: 'TN'
        },
        address_to: addressTo,
        parcels: [{
          length: '20',
          width: '15',
          height: '10',
          distance_unit: 'cm',
          weight: weight,
          mass_unit: 'kg'
        }],
        async: false
      })
    });
    app.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency || 'eur',
          product_data: {
            name: 'FitSense Order',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://fitsense.app/success',
      cancel_url: 'https://fitsense.app/cancel',
    });

    res.json({ 
      url: session.url,
      sessionId: session.id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
    const data = await response.json();
    const rates = data.rates.map(r => ({
      provider: r.provider,
      service: r.servicelevel.name,
      price: r.amount,
      currency: r.currency,
      days: r.estimated_days
    }));
    res.json({ rates });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
