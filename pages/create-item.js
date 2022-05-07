import { useEffect, useState } from 'react'
import {ethers} from 'ethers'
import Web3Modal from 'web3modal'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import {nftaddress, nftmarketaddress} from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import Image from 'next/image'

export default function CreateItem() {
    const [ fileUrl, setFileUrl ] = useState(null)
    const [formInput, updateFormInput ] = useState({price: '', name: '', description: ''})
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            //try uploading the file
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            //get the file locating in url
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url)
        } catch (e) { 
            console.log(e);
        }
    }

    //1. create NFT item (either image or video)
    async function createItem() {
        const {name,description,price} = formInput;//get the value from the form input

        if (!name || !description || !price || !fileUrl) { return }//form validation 

        const data = JSON.stringify({
            name, description, image: fileUrl
        });//stringify them

        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            //pass the url to save it on polygon after it has been uploaded to ipfs
            createSale(url)
        } catch (error) {
            console.log('Error uploading file: ', error);
        }
    }

    //2. list item for sale
    async function createSale(url) {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);

        //sign the transaction
        const signer = provider.getSigner();
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        //get the tokenId from the transaction that occured above by the event array that is returned
        //the first item from that event is the event while the third item is the token id
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber() //it has to be converted to a number

        //get reference to the price entered in the form
        const price = ethers.utils.parseUnits(formInput.price, 'ether')

        contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);

        //get the listing price 
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(
            nftaddress, tokenId, price, {value: listingPrice}
        )

        await transaction.wait()

        router.push('/')
    }

    return (
        <div className='flex justify-center'>
            <div className='w-1/2 flex flex-col pb-12'>
                <input placeholder='Asset Name' className='mt-8 border rounded p-4' onChange={e => updateFormInput({...formInput, name: e.target.value})} />
                
                <textarea placeholder='Asset Description' className='mt-2 border rounded p-4' onChange={e => updateFormInput({...formInput, description: e.target.value})} />

                <input placeholder='Asset Price in Eth' type="number" className='mt-8 border rounded p-4' onChange={e => updateFormInput({...formInput, price: e.target.value})} />

                <input type="file" name="Asset" className='my-4' onChange={onChange} />
                {
                    fileUrl && (
                        <Image
                            src={fileUrl}
                            className='rounded mt-4'
                            width={350}
                            height={500}
                        />
                    )
                }

                <button className="bg-green-500 text-white font-bold mt-4 rounded shadow-lg p-4" onClick={createItem}> CREATE NFT</button>
            </div>
        </div>
    )
}