const express = require('express')
const router = express.Router()
const { updateCampaignBudget, updateCampaignStatus, turnAllCampaigns } = require('../lib/facebookAPI')
const { registerMetrics, getLastLog } = require('../lib/sheetsUpload')


router.get('/', async (req, res) => { 
    let campaigns = await getLastLog()
    // res.send(lastLog)
    res.render('campaigns/campaign-list', {campaigns})
})

router.get('/:id/:status', async(req, res) => {
    const { id, status } = req.params
    if(status == 'on') {
        if(id == 'all') {
            await turnAllCampaigns(true)
        } else {
            await updateCampaignStatus([id], true)
        }
    } else {
        if(id == 'all') {
            await turnAllCampaigns(false)
        } else {
            await updateCampaignStatus([id], false)
        }
    }
    res.redirect('/admin/campaigns/')
})

router.get('/makelog', async (req, res) => {
    await registerMetrics()
    res.redirect('/admin/campaigns')
})

module.exports = router;