const express = require('express');
const router = express.Router();
const { getPayments, registerPayment, deletePayment, getAdminPayments, makeAdminPayment } = require('../database/payments.js');
const { isLoggedIn } = require('../middlewares/auth-md.js');
const { getCustomerById } = require('../database/customers.js');
const { getAdminById } = require('../database/users.js');
const { sendEmail } = require('../connections/email-manager.js');

router.get('/customer/:userId', isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params
        const customer = await getCustomerById(userId)
        if (req.user.id != userId && customer?.user_id != req.user.id) {
            res.redirect("/logout")
            return
        }
        const payments = await getPayments(userId);
        res.render('payments-view/customer-payments', { payments, userId, allowDelete: true })
    } catch (err) {
        console.log(err)
    }
})

router.post('/customer/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const admin = await getAdminById(req.user.id)
        const customer = await getCustomerById(userId)
        const newPayment = await registerPayment(req.body, userId)
        const message = `
        ¡Hola, ${customer.fullname}!

        Se ha registrado un pago en tu proceso de crédito:
        - Motivo: ${newPayment.description || "No registrado"}
        - Monto pagado: $${newPayment.paid_amount}.00
        - Monto pendiente: $${newPayment.pending_amount}.00
        - Funcionario: ${newPayment.recipient || "no registrado"}
        - Dirección: ${newPayment.address || "no registrada"}
        Ingresa a la plataforma para continuar con el proceso.

        Contáctanos:
        - ${admin.email}
        ${admin.name}
        `
        console.log(customer.email)
        await sendEmail(admin.name, customer.email, "Pago Registrado en la plataforma", message)
        res.redirect(`/payments/customer/${userId}`)
    } catch (err) {
        console.log(err)
    }
})

router.get('/customer/delete/:paymentId', async (req, res) => {
    try {
        await deletePayment(req.params.paymentId);
        res.status(200).json({ message: "Payment deleted successfully" })
    } catch (err) {
        console.log(err)
    }
})

// ADMIN PAYMENTS

router.get('/admin/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params
        const admin = await getAdminById(id)
        const payments = await getAdminPayments(id, initial_pay)
        res.render('auth-view/admin-payments', { admin, payments });
    } catch (err) {
        console.log(err)
        req.flash('message', `${err}`)
        res.redirect('/superuser/admins')
    }
})

router.get('/admin/make-payment/:admin_id/:option', isLoggedIn, async (req, res) => {
    try {
        const { admin_id, option } = req.params
        await makeAdminPayment(admin_id, option)
        req.flash('success', 'Pago realizado con éxito');
        res.redirect('/superuser/admins');
    } catch (err) {
        console.log(err);
        req.flash('message', `Error al realizar el pago`)
        res.redirect('/superuser/admins')
    }
})

module.exports = router;