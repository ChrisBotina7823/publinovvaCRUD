const { google } = require('googleapis')
const path = require('path')
const { getCampaigns } = require('./facebookAPI')

const scopes = ['https://www.googleapis.com/auth/drive']
const spreadsheetId = '1rm5CgfKelqlLWqStL-VBhSBjAi6r9i1KW10Wr5xoNp0'

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, './drive-credentials.json'),
    scopes: scopes
})

const sheets = google.sheets({
    version: 'v4',
    auth
})

function hashCode(id) {
    let s = id.toString()
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return Math.abs(h);
}



const createCampaignSheet = async campaign => {
    const title = campaign.name, sheetId = hashCode(campaign.id), startColumnIndex = 0, endColumnIndex = 6, startRowIndex = 0, endRowIndex = 1;

    // Create the sheet and update its values in a single API call
    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title,
                            sheetId
                        }
                    }
                },
                {
                    mergeCells: {
                        range: {
                            sheetId,
                            startRowIndex,
                            endRowIndex,
                            startColumnIndex,
                            endColumnIndex
                        },
                        mergeType: 'MERGE_ALL'
                    }
                },
                {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex,
                            endRowIndex,
                            startColumnIndex,
                            endColumnIndex
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: 'CENTER'
                            },
                            userEnteredValue: {
                                stringValue: campaign.name
                            }
                        },
                        fields: 'userEnteredFormat.horizontalAlignment,userEnteredValue'
                    }
                },
                {
                    updateCells: {
                        rows: [
                            {
                                values: [
                                    { userEnteredValue: { stringValue: 'Fecha' } },
                                    { userEnteredValue: { stringValue: 'Clics' } },
                                    { userEnteredValue: { stringValue: 'Mensajes' } },
                                    { userEnteredValue: { stringValue: 'CPC' } },
                                    { userEnteredValue: { stringValue: 'CPR' } },
                                    { userEnteredValue: { stringValue: 'Gasto' } }
                                ]
                            }
                        ],
                        fields: 'userEnteredValue',
                        start: {
                            sheetId,
                            rowIndex: 1,
                            columnIndex: 0
                        }
                    }
                }
            ]
        }
    });

    return sheetId;
}


const registerMetrics = async () => {

    const campaigns = await getCampaigns(true)
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetIds = {};
    const ranges = [];
    for (let campaign of campaigns) {
        // check if there is a sheet for this campaign and create it if does not exist
        const sheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === campaign.name);
        let sheetId;
        if (sheet == undefined) {
            sheetId = await createCampaignSheet(campaign);
        } else {
            sheetId = sheet.properties.sheetId;
        }
        ranges.push(`${campaign.name}!A:A`);
    }

    // Get the first column for all campaigns
    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges
    });
    const valueRanges = response.data.valueRanges;

    // Prepare update requests
    const requests = [];
    for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const values = valueRanges[i].values || [];
        const currentDate = new Date().toLocaleDateString('es-ES', {timeZone: 'America/Bogota'});
        let rowIndex = values.findIndex(row => row[0] === currentDate || row[0] === '');
        if (rowIndex === -1) rowIndex = values.length;

        // Insert data into that row
        requests.push({
            updateCells: {
                rows: [
                    {
                        values: [
                            { userEnteredValue: { stringValue: currentDate } },
                            { userEnteredValue: { numberValue: campaign.clicks } },
                            { userEnteredValue: { numberValue: campaign.messages } },
                            { userEnteredValue: { numberValue: campaign.cpc } },
                            { userEnteredValue: { numberValue: campaign.cpr } },
                            { userEnteredValue: { numberValue: campaign.spend } }
                        ]
                    }
                ],
                fields: 'userEnteredValue',
                start: {
                    sheetId: hashCode(campaign.id),
                    rowIndex,
                    columnIndex: 0
                }
            }
        });
    }

    // Update data for all campaigns in a single API call
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests
        }
    });
}



const getLastLog = async () => {
    const activeCampaigns = await getCampaigns(true)
    // console.log(activeCampaigns)

    let campaigns = activeCampaigns.map( campaign => Object.assign({}, campaign) )

    // Get the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

    // Create sheets for campaigns that do not have a corresponding sheet in the spreadsheet
    for (let campaign of campaigns) {
        const sheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === campaign.name);
        if (!sheet) {
            await registerMetrics(campaigns);
            break;
        }
    }

    // Get the first column for all campaigns
    const columnValues = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: campaigns.map(campaign => `${campaign.name}!A:A`)
    });
    const currentDate = new Date().toLocaleDateString('es-ES', {timeZone: 'America/Bogota'});
    const yesterdayDate = new Date(Date.now() - 86400000).toLocaleDateString('es-ES', {timeZone: 'America/Bogota'});

    for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const values = columnValues.data.valueRanges[i].values || [];
        let rowIndex = values.findIndex(row => row[0] === currentDate);
        if (rowIndex === -1) {
            rowIndex = values.findIndex(row => row[0] === yesterdayDate)
        }

        // Get values from columns B to F of that row
        const rowValues = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${campaign.name}!B${rowIndex + 1}:F${rowIndex + 1}`
        });

        const log = rowValues.data.values[0];

        // console.log(log)

        Object.assign(campaign, {
            clicks: Math.round(campaign.clicks - log[0]),
            messages: Math.round(campaign.messages - log[1]),
            spend: Math.round(campaign.spend - log[4])
        });

        campaign.cpc = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0
        campaign.cpr = campaign.messages > 0 ? campaign.spend / campaign.messages : 0
    }
    return campaigns;   
}


module.exports = {
    registerMetrics,
    getLastLog
}