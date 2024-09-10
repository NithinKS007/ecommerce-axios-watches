const wallet = require('../models/walletModel');

const loadWallet = async (req, res) => {

    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5    

    try {

        const currentUser = req.currentUser

        let walletData = await wallet.findOne({ userId: currentUser._id });

        if (!walletData) {

            const newWalletData = new wallet({

                userId: currentUser._id

            });

            walletData = await newWalletData.save();
        }

        const totalTransactions = walletData.transactions.length;
        const totalPages = Math.max(1, Math.ceil(totalTransactions / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;

        const transactionsData = walletData.transactions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(skip, skip + perPageData);

        return res.status(200).render("user/wallet", { 
            walletData,
            transactionsData,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {

        console.log(`Error while loading the wallet page:`, error.message);

        return res.status(500).render("user/500")
    }
}


module.exports = {

    loadWallet
}