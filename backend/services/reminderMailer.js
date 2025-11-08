import dotenv from 'dotenv';
import { Resend } from 'resend';

// Asegurarnos de cargar variables de entorno siempre que se importe el servicio.
dotenv.config();

// Usar la API key desde variables de entorno. No incluir claves en el código.
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
    throw new Error('RESEND_API_KEY no definida. Añádela en backend/.env o en las variables de entorno.');
}

const resend = new Resend(resendApiKey);

/**
 * Envía un correo de recordatorio usando Resend.
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} htmlBody
 */
export const sendReminderEmail = async (toEmail, subject, htmlBody) => {
    try {
        const data = await resend.emails.send({
            from: 'Alzheon <onboarding@resend.dev>',
            to: [toEmail],
            subject,
            html: htmlBody
        });

        console.log(`Email enviado a ${toEmail}: ${data.id || 'sin-id'}`);
        return data;
    } catch (error) {
        console.error('Error enviando email con Resend:', error?.message || error);
        throw error;
    }
};

/** Helper para construir un HTML simple */
export const buildReminderHtml = (nombre, motivationalMessage) => {
    return `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111">
            <h2>Hola ${nombre || 'amigo'},</h2>
            <p>${motivationalMessage}</p>
            <p>Un abrazo del equipo de Alzheon.</p>
        </div>
    `;
};
