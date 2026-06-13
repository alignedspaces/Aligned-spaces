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
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; padding: 40px 20px;">
        <tr>
            <td align="center">
                
                <!-- Main Container -->
                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #E5E0D8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                    
                    <!-- Header with Beige Background -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px; background-color: #FDFBF7; border-bottom: 2px solid #D5BBAE;">
                            <img src="https://alignedspaces.us/logoemail.jpg" alt="Aligned Spaces" style="max-width: 400px; width: 80%; height: auto; display: block;">
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; background-color: #ffffff;">
                            <h2 style="font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 400; text-align: center; margin-top: 0; margin-bottom: 30px; color: #2C2B29; letter-spacing: 0.5px;">
                                Thank you for your reservation, ${name.split(' ')[0]}.
                            </h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px; color: #5A5957;">
                                Thank you for welcoming Aligned Spaces into your property. Whether it's your personal home or an investment space, we know how important it is, and we are deeply grateful for the trust you place in us. Caring for your space is a privilege we don't take lightly.
                            </p>

                            <!-- Receipt Box -->
                            <div style="background-color: #FDFBF7; padding: 25px; border-radius: 6px; border-left: 4px solid #D5BBAE; margin-bottom: 30px;">
                                <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888; border-bottom: 1px solid #E5E0D8; padding-bottom: 10px;">
                                    Reservation Details
                                </h3>
                                
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 15px; color: #2C2B29;"><strong>Service:</strong></td>
                                        <td style="padding: 6px 0; font-size: 15px; color: #5A5957; text-align: right;">${quoteData.service}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 15px; color: #2C2B29;"><strong>Date:</strong></td>
                                        <td style="padding: 6px 0; font-size: 15px; color: #5A5957; text-align: right;">${date}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 15px; color: #2C2B29;"><strong>Time:</strong></td>
                                        <td style="padding: 6px 0; font-size: 15px; color: #5A5957; text-align: right;">${time}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 15px; color: #2C2B29;"><strong>Location:</strong></td>
                                        <td style="padding: 6px 0; font-size: 15px; color: #5A5957; text-align: right;">${address}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding: 15px 0 5px 0;">
                                            <div style="border-top: 1px solid #E5E0D8;"></div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0 0 0; font-size: 16px; color: #2C2B29;"><strong>Estimated Total:</strong></td>
                                        <td style="padding: 10px 0 0 0; font-size: 16px; color: #D5BBAE; text-align: right;"><strong>$${Number(quoteData.total).toLocaleString()}</strong></td>
                                    </tr>
                                </table>
                            </div>

                            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px; color: #5A5957;">
                                Our goal is to always deliver a pristine, perfectly aligned environment. We look forward to a long and valued relationship with you. If there is ever anything more we can do, please let us know!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #E5E0D8; background-color: #FDFBF7;">
                            <p style="font-size: 13px; color: #2C2B29; margin-bottom: 8px;"><strong>Cancellation Policy</strong></p>
                            <p style="font-size: 12px; color: #888888; line-height: 1.5; margin: 0;">
                                Please note that to ensure the highest quality of service, cancellations made within 24 hours of the scheduled cleaning may incur a cancellation fee.
                            </p>
                            <p style="font-size: 12px; color: #aaaaaa; margin-top: 20px; margin-bottom: 0;">
                                &copy; 2026 Aligned Spaces. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- End Main Container -->

            </td>
        </tr>
    </table>
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
