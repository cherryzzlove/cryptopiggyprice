const functions = require("firebase-functions")
const admin = require("firebase-admin")
const axios = require("axios")
const cheerio = require("cheerio")

admin.initializeApp()

const broadcast = (priceCurrent) => {
    const prices = priceCurrent.split("|")
    return axios({
        method : "post" ,
        url : "https://api.line.me/v2/bot/message/broadcast" ,
        headers : {
            "Content-Type" : "application/json" ,
            Authorization : "Bearer lJxvpto0jkqdK8yIZ5IBFEoa8jOLPfHppH7K7r45oK+s6DoYUZ1h0GoYpqkCgsYtGA3ivbrNeX6IvXYqHh58bxnwAkgq9OhgVIntQAWpuvmHuzTXFUURkHpi+Uurqx+RijA831FUFG1swtoggWFuygdB04t89/1O/w1cDnyilFU="
        } ,
        data : JSON.stringify({
            messages : [{
                type : "text" ,
                text : "ตัวอย่าง Cherry: " + prices[0]
            }]
        })
    })
}

exports.gold = functions.pubsub.schedule("* * */1 * *").timeZone("Asia/Bangkok").onRun(async context => {
    // region Step 1 ดึงข้อมูล เวป
    const response = await axios.get(`https://goldtraders.or.th`)
    const html = response.data
    const $ = cheerio.load(html)

    const sell1 = $("#DetailPlace_uc_goldprices1_lblBLSell").text()
    const buy1 = $("#DetailPlace_uc_goldprices1_lblBLBuy").text()
    const sell2 = $("#DetailPlace_uc_goldprices1_lblOMSell").text()
    const buy2 = $("#DetailPlace_uc_goldprices1_lblOMBuy").text()
    // endregion

    // region Step 2 Update ราคา + ส่งข้อความถึงทุกคน
    const priceCurrent = sell1 + "|" + buy1 + "|" + sell2 + "|" + buy2
    let priceLast = await admin.firestore().doc("line/gold").get()

    const isNoData = !priceLast.exists                               // หากยังไม่มีข้อมูล ?
    const isDataDifference = priceLast.data().price !== priceCurrent // ข้อมูลราคา ซื้อ-ขาย ไม่ตรงกับข้อมูลล่าสุด ?

    if(isNoData === true || isDataDifference === true) {
        await admin.firestore().doc("line/gold").set({ price : priceCurrent })
        broadcast(priceCurrent)
    }
    // endregion
})
