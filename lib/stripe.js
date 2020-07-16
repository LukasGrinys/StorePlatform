module.exports = class Stripe {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            require('dotenv').config();
        }
    }

    sendStripeKeys(data, callback) {
        let stripePublicKey = process.env.STRIPE_PUBLIC_KEY
        var obj = {
            stripePublicKey : stripePublicKey
        }
        if (data.method === "get") {
            callback(200, obj);
        } else {
            callback(403);
        } 
    }
}