require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to create a PaymentIntent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, service, name, email } = req.body;

        // amount is expected in cents
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            description: `Cleaning Service: ${service}`,
            receipt_email: email,
            metadata: {
                customer_name: name,
                service_type: service
            },
            // Restrict explicitly to Card to prevent Klarna/Afterpay (ACH doesn't support manual capture)
            payment_method_types: ['card'],
            // This tells Stripe we want to place a hold (authorize) but NOT capture yet
            capture_method: 'manual', 
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (e) {
        console.error(e.message);
        res.status(400).json({ error: e.message });
    }
});

// Endpoint to capture an authorized payment
app.post('/api/capture-payment', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) return res.status(400).json({ error: "Missing paymentIntentId" });
        
        const intent = await stripe.paymentIntents.capture(paymentIntentId);
        res.json({ success: true, intent });
    } catch (e) {
        console.error("Capture Error:", e.message);
        res.status(400).json({ error: e.message });
    }
});

// Endpoint to cancel an authorized payment
app.post('/api/cancel-payment', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) return res.status(400).json({ error: "Missing paymentIntentId" });
        
        const intent = await stripe.paymentIntents.cancel(paymentIntentId);
        res.json({ success: true, intent });
    } catch (e) {
        console.error("Cancel Error:", e.message);
        res.status(400).json({ error: e.message });
    }
});

// Endpoint to send booking email
app.post('/api/send-booking', async (req, res) => {
    try {
        const { name, email, phone, date, time, address, notes, quoteData } = req.body;

        // Configure Nodemailer
        // You will need to put a real EMAIL_USER and EMAIL_PASS in your .env file
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 1. Email to the Client (Beautiful HTML Receipt)
        const mailOptionsClient = {
            from: `"Aligned Spaces Concierge" <${process.env.EMAIL_USER}>`,
            to: email, // Send to the customer
            subject: `Your Booking is Confirmed - Aligned Spaces`,
            html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFBF7; color: #2C2B29; padding: 40px; border-radius: 8px; border: 1px solid #e5e5e5;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-family: 'Times New Roman', serif; font-size: 28px; letter-spacing: 2px; margin: 0; color: #2C2B29;">ALIGNED SPACES</h1>
                    <div style="height: 2px; background-color: #D5BBAE; width: 60px; margin: 15px auto;"></div>
                </div>
                
                <h2 style="font-size: 20px; font-weight: 400; text-align: center; margin-bottom: 30px;">Thank you for your reservation, ${name.split(' ')[0]}.</h2>
                
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Thank you for welcoming Aligned Spaces into your property. Whether it's your personal home or an investment space, we know how important it is, and we are deeply grateful for the trust you place in us. Caring for your space is a privilege we don't take lightly.
                </p>

                <div style="background-color: #ffffff; padding: 25px; border-radius: 6px; border-left: 4px solid #D5BBAE; margin-bottom: 30px;">
                    <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #5A5957;">Reservation Details</h3>
                    <p style="margin: 8px 0; font-size: 15px;"><strong>Service:</strong> ${quoteData.service}</p>
                    <p style="margin: 8px 0; font-size: 15px;"><strong>Date:</strong> ${date}</p>
                    <p style="margin: 8px 0; font-size: 15px;"><strong>Time:</strong> ${time}</p>
                    <p style="margin: 8px 0; font-size: 15px;"><strong>Location:</strong> ${address}</p>
                    <p style="margin: 8px 0; font-size: 15px;"><strong>Estimated Total:</strong> $${Number(quoteData.total).toLocaleString()}</p>
                </div>

                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                    Our goal is to always deliver a pristine, perfectly aligned environment. We look forward to a long and valued relationship with you. If there is ever anything more we can do, please let us know!
                </p>

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 13px; color: #5A5957; margin-bottom: 5px;"><strong>Cancellation Policy</strong></p>
                    <p style="font-size: 12px; color: #777; line-height: 1.5; margin: 0;">Please note that to ensure the highest quality of service, cancellations made within 24 hours of the scheduled cleaning may incur a cancellation fee.</p>
                </div>
            </div>
            `
        };

        // 2. Email to the Owner (Plain text notification)
        const mailOptionsOwner = {
            from: `"Website System" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to Natalia
            subject: `🚨 NEW BOOKING: ${name} - ${quoteData.service}`,
            text: `
You have a new booking from the website!

Client Details:
Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Address: ${address || 'N/A'}

Service Details:
Service: ${quoteData.service}
Date: ${date}
Time: ${time}
Estimated Total: $${quoteData.total}

Notes:
${notes || 'None'}

Please check your Stripe Dashboard to see the authorized payment.
            `
        };

        // Send both emails
        await transporter.sendMail(mailOptionsClient);
        await transporter.sendMail(mailOptionsOwner);

        res.json({ success: true, message: 'Email sent successfully!' });
    } catch (e) {
        console.error('Error sending email:', e.message);
        res.status(500).json({ error: 'Failed to send email. Google says: ' + e.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

// Export the Express API for Vercel
module.exports = app;
