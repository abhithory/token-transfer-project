const express = require('express');
const { ethers } = require('ethers');
const { erc20ABI } = require('./abi');
require('dotenv').config();

const app = express();

app.use(express.json());

// Define your Ethereum provider URL
const goerliUrl = process.env.GOERLI_URL || 'https://eth-goerli.api.onfinality.io/public';
const mainnetUrl = process.env.MAINNET_URL || 'https://ethereum.publicnode.com';

const providerUrl = process.env.ENV === "production" ? mainnetUrl : goerliUrl;
const provider = new ethers.JsonRpcProvider(providerUrl);


const transferTokentokenAddress = async (tokenAddress, privateKey, receiverAddress, amountInWei, wait = true) => {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        wallet.connect(provider);
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, wallet);
        const tx = await tokenContract.transfer(receiverAddress, ethers.getBigInt(String(amountInWei)));
        const receipt = await tx.wait();
        return receipt.hash
    } catch (error) {
        throw error
    }
}

app.post('/token-transfer', async (req, res) => {
    try {
        const {
            tokenAddress,
            adminPrivateKey,
            user1PrivateKey,
            user2PublicKey,
            amountInWei,
        } = req.body;

        if (!(tokenAddress && adminPrivateKey && user1PrivateKey && user2PublicKey && amountInWei)) {
            throw Error("Please provide all details")
        }
        const user1 = new ethers.Wallet(user1PrivateKey, provider);
        const hash1 = await transferTokentokenAddress(tokenAddress, adminPrivateKey, user1.address, amountInWei);
        console.log("hash1", hash1);
        const hash2 = await transferTokentokenAddress(tokenAddress, user1PrivateKey, user2PublicKey, amountInWei);
        console.log("hash2", hash2);
        return res.json({ success: true, transactionHash1: hash1, transactionHash2: hash2 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server Mode ${process.env.ENV}`);
});


app.post('/create-wallet', (req, res) => {
    try {
        const wallet = ethers.Wallet.createRandom();

        res.status(200).json({
            success: true,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'An error occurred while generating the wallet.' });
    }
});
