const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/auth-md.js');
const { getAllAdmins, registerAdmin, getAdminById, updateAdminById, switchAdminStatus } = require('../database/users.js');

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const admins = await getAllAdmins()
        res.render('admins-view/admin-list', { admins })
    } catch (err) {
        console.error(err)
    }
});

router.get('/add-form', isLoggedIn, async (req, res) => {
    try {
        res.render('auth-view/admin-signup', { superuser: true })
    } catch (err) {
        console.error(err)
    }
})

router.post('/', isLoggedIn, async (req, res) => {
    try {
        await registerAdmin(req.body)
    } catch (err) {
        console.error(err)
    } finally {
        res.redirect('/')
    }
})

router.get('/edit-form/:id', isLoggedIn, async (req, res) => {
    try {
        const admin = await getAdminById(req.params.id)
        res.render('auth-view/admin-edit', { admin });
    } catch (err) {
        console.log(err)
        req.flash('message', `${err}`)
        res.redirect('/superuser/admins')
    }
})

router.post('/edit/:id', isLoggedIn, async (req, res) => {
    try {
        await updateAdminById(req.params.id, req.body)
        req.flash('success', 'Administrador editado con éxito');
        res.redirect('/superuser/admins');
    } catch (err) {
        console.log(err);
        req.flash('message', `Error al editar usuario`)
        res.redirect('/superuser/admins')
    }
})

router.get('/switch-status/:id', isLoggedIn, async (req, res) => {
    try {
        await switchAdminStatus(req.params.id)
        res.redirect('/')
    } catch(err) {
        console.error(err)
    }
})

module.exports = router;