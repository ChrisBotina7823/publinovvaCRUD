const dotenv = require('dotenv');
dotenv.config()
const axios = require('axios')

let activeIDs = [
    '23856756951880255', // jep TR_WPP
    '23856402848000255', // Transito WPP
    '23856436868720255', // Eugenio WPP
    '23856403966150255', // multiempresarial MSG
    '23856403057430255', // Internacional WPP
    '23856315709570255' // Crediayora MSG
]

// activeIDs = [
//     '23856497249690255' // Publinovva Marketing
// ]

const account_id = process.env.FB_ACCOUNT_ID, access_token = process.env.FB_ACCESS_TOKEN

const url_header = `https://graph.facebook.com/v17.0/`
const url_footer = `&access_token=${access_token}`

const getCampaigns = async currentCampaigns => {
    // Getting basic information
    let url = url_header + `${account_id}` + '/campaigns?fields=id,name,status,daily_budget,insights{actions,inline_link_clicks,cpc,spend}' + url_footer
    let response = await axios.get(url)
    let campaigns = response.data.data
    // console.log(campaigns)

    for(let campaign of campaigns) {
        Object.assign(campaign, { cpc: 0, spend: 0, messages: 0, cpr: 0, clicks: 0 });
        if(campaign.status == 'ACTIVE') {
            campaign.active = true
        } else {
            campaign.active = false
        }
        if(campaign.insights != undefined) {
            const insights = campaign.insights.data[0]
            campaign.spend = parseFloat(insights.spend)
            if(insights.inline_link_clicks != undefined) {
                campaign.clicks = insights.inline_link_clicks
            }
            if(insights.cpc != undefined) {
                campaign.cpc = insights.cpc
            }
            if(insights.actions != undefined) {
                let messages = insights.actions.find( action => action.action_type == "onsite_conversion.messaging_conversation_started_7d")
                if( messages != undefined) {
                    campaign.messages = parseFloat(messages.value)
                    if(campaign.messages > 0) {
                        campaign.cpr = campaign.spend / campaign.messages
                    }
                }
            }
        }
        // clear insights value
        delete campaign.insights
        delete campaign.status
    }

    if(currentCampaigns) {
        campaigns = campaigns.filter( campaign => activeIDs.includes(campaign.id) )
    }

    return campaigns
}

const updateCampaignStatus = async (ids, newStatus) => {
    if(newStatus) {
        statusStr = 'ACTIVE'
    } else {
        statusStr = 'PAUSED'
    }
    await axios.all(ids.map( id => axios.post( url_header + id, {
        status:statusStr,
        access_token:`${access_token}`
    } ) ))

    // for(let id of ids) {
    //     const url = url_header + id
    //     await axios.post(url, {
            // status:statusStr,
            // access_token:`${access_token}`
    //     })
    // }
}

const updateCampaignBudget = async (campaignId, newBudget) => {
    await axios.post( url_header + campaignId, {
        daily_budget: newBudget,
        access_token
    } )
}

const turnAllCampaigns = async (status) => {
    await updateCampaignStatus(activeIDs, status)
}

module.exports = {
    getCampaigns,
    updateCampaignStatus,
    turnAllCampaigns,
    updateCampaignBudget
}