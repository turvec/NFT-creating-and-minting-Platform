//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";// prevent re-entrancy attacks

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;// total number of items ever created
    Counters.Counter private _itemsSold; // total number of items sold

    address payable owner; // owner of the smart contract
    uint listingPrice = 0.025 ether; // amount people have to pay for their nft to be listed

    constructor(){
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    //a way to access values of the MarketItem struct above by passing an integer ID
    mapping(uint => MarketItem) private idMarketItem;

    //log message (when item is sold)
    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address  seller,
        address owner,
        uint256 price,
        bool sold
    );

    function setListingPrice(uint _price) public returns (uint) {
        if(msg.sender == address(this)){
            listingPrice = _price;
        }
        return listingPrice;
    }

    ///@notice to get market listing price 
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    /// @notice to create market item
    function createMarketItem(address nftContract, uint256 tokenId, uint256 price)
        public payable nonReentrant {
        require(price >  0,"price can't be null");
        require(msg.value == listingPrice,"price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),//address of seller putting the nft up for sale
            payable(address(0)),// no owner yet (set the owner to empty address)
            price,
            false

        );
          // transfer ownership of the nft to the contract itself
      IERC721(nftContract).transferFrom(msg.sender,address(this),tokenId);

      emit MarketItemCreated(itemId, nftContract, tokenId,msg.sender, address(0),price,false);// log this transaction
    }

  

    ///@notice handle sales
    function createMarketSale(address nftContract, uint256 itemId ) public payable nonReentrant {
        uint price =  idMarketItem[itemId].price;
        uint tokenId =  idMarketItem[itemId].tokenId;

        require(msg.value == price, "Wrong amount" );
        //pay the seller the amount
        idMarketItem[itemId].seller.transfer(msg.value);

        //transfer ownership of nft to the contract itself
        IERC721(nftContract).transferFrom(address(this),msg.sender,tokenId);

        idMarketItem[itemId].owner = payable(msg.sender);//mark buyer as new owner of the item
        idMarketItem[itemId].sold = true;//mark item as sold
        _itemsSold.increment();//increment the total number of items sold by 1
        payable(owner).transfer(listingPrice);

    }

    ///@notice function to get and show only the total number of remaining unsold items on our platform 
    function fetchUnsoldItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();// total number of items ever created
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();//subtract sold items from total items

        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        //loop through all items ever created
        for (uint i = 0; i < itemCount; i++) {
            //check if item has not been sold (by checking if the owner field is empty)
            if (idMarketItem[i+1].owner == address(0)) {
                //gets only unsold items and store in a temporary array
                uint currentId = idMarketItem[i+1].itemId;//get id of the unsold item
                MarketItem storage currentItem = idMarketItem[currentId];//create datas for the unsold item
                items[currentIndex] = currentItem;//finally store unsold item on the temporary table
                currentIndex += 1;//increment index

            }
        }
        return items; // return the temporary array of unsold items
    }

    ///@notice fetch list of nfts bought/owned by the particular user
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        // get total items ever created
        uint totalItemCount = _itemIds.current();

        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            //get only the items that this user has bought/is the owner
            if(idMarketItem[i+1].owner == msg.sender){
                itemCount += 1; //total number/length
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            //get only the items that this user has bought/is the owner
            if(idMarketItem[i+1].owner == msg.sender){
                uint currentId = idMarketItem[i+1].itemId;//get id of owned item
                MarketItem storage currentItem = idMarketItem[currentId];//create datas for owned item
                items[currentIndex] = currentItem;//finally store owned item on the temporary table
                currentIndex += 1;//increment index
            }
        }
        return items; // return the temporary array of owned items
    }

    ///@notice fetch list of nfts created by the particular user
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        // get total items ever created
        uint totalItemCount = _itemIds.current();

        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            //get only the items that this user has sold/is the seller
            if(idMarketItem[i+1].seller == msg.sender){
                itemCount += 1; //total number/length
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            //get only the items that this user has sold/is the seller
            if(idMarketItem[i+1].seller == msg.sender){
                uint currentId = idMarketItem[i+1].itemId;//get id of sold item
                MarketItem storage currentItem = idMarketItem[currentId];//create datas for sold item
                items[currentIndex] = currentItem;//finally store sold item on the temporary table
                currentIndex += 1;//increment index
            }
        }
        return items; // return the temporary array of sold items
    }
}