import {ethers} from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import styles from '../styles/Home.module.css';
import {nftaddress, nftmarketaddress} from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import Image from 'next/image'

export default function Home() {

  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(()=>{
    loadNFTs();
    },[]);
  
  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider("https://polygon-mumbai.infura.io/v3/f58da0c1f04e4013b61956c96f6f8102");
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, provider);

    //return an array of unsold market items
    const data = await marketContract.fetchUnsoldItems();

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      let price = ethers.utils.formatUnits(i.price.toString(),'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item;
    }))

    setNfts(items);
    setLoadingState('loaded');
    
  }

  async function buyNFT(nft) {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    //sign the transaction
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);

    //get price
    const price = ethers.utils.parseUnits(nft.price.toString(),'ether');

    //make the sale
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId , {value: price});
    await transaction.wait();

    loadNFTs();
  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl"> No items in NFTurvy </h1>
  )

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px'}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image
                  src={nft.image}
                  alt="Picture of the nft"
                  width={350}
                  height={250}
                />
                <div className="p-3 mb-2">
                  <p style={{ height: '64px' }} className="text-2xl text-green-500 font-semibold">
                    {nft.name}
                  </p>
                  <div style={{ height: '10px',  }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="bg-black p-4">
                  <p className="text-2xl mb-4 font-bold text-white" >
                    {nft.price} ETH
                  </p>
                  <button className="w-full bg-green-400 text-white font-bold py-2 px-12 rounded" onClick={() => buyNFT(nft)}> BUY NFT</button>
                  
                </div>
              </div>
           ))
          }
        </div>
      </div>
    </div>
  )
}
