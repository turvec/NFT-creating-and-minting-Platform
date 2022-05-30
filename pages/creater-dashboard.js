import {ethers} from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import {nftaddress, nftmarketaddress} from '../config';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

import Image from 'next/image'

export default function CreatorDashboard() {

  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(()=>{
    loadNFTs();
    },[]);
  
  async function loadNFTs() {
      const web3modal = new Web3Modal({
        //   network: "mainnet",
        //   cacheProvider: true,
      })
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);

    //return an array of unsold market items
    const data = await marketContract.fetchItemsCreated();

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

    const soldItems = items.filter(i => i.sold)
    setSold(soldItems)
    setNfts(items)
    setLoadingState('loaded')
    
  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl"> You have not created any NFT </h1>
  )

  return (
    <div>
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: '1600px'}}>
            <h1 className="px-20 py-10 text-3xl"> All NFTs You have Created </h1>
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
                        </div>
                    </div>
                ))
                }
                </div>
            </div>
        </div>
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: '1600px'}}>
            <h1 className="px-20 py-10 text-3xl"> Your Sold NFTs </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {
                    sold.map((nft, i) => (
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
                        </div>
                    </div>
                ))
                }
                </div>
            </div>
        </div>
    </div>
  )
}
