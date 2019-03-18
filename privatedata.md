# Private data

> We mainly expose the capability and make it easier for you to use it, we don't modify it by any means so that you don't have to worry about new concepts or depend on us forever. So please refer to the [official documentation](https://hyperledger-fabric.readthedocs.io/en/release-1.4/private_data_tutorial.html) to see how private data works.

In recent versions of Hyperledger Fabric, it's now possible to handle [private collections of data](https://hyperledger-fabric.readthedocs.io/en/release-1.4/private_data_tutorial.html).

You usually need a config file (for now, collections are static with Fabric 1.4). Here you define the collections and the policy of access. This comes from an official [Fabric Sample](https://github.com/hyperledger/fabric-samples/tree/release-1.4/chaincode/marbles02_private) code.

```json
[
 {
   "name": "collectionMarbles",
   "policy": "OR('org1MSP.member', 'org2MSP.member')",
   ...
},
 {
   "name": "collectionMarblePrivateDetails",
   "policy": "OR('org1MSP.member')",
   ...
 }
]
```

After the chaincode is instantiated with the collection, it's possible to make invocations passing *transient* data (which has to be [base64 encoded](https://hyperledger-fabric.readthedocs.io/en/release-1.4/private_data_tutorial.html#store-private-data)).

For example, from the official Fabric documentation:

```bash
export MARBLE=$(echo -n "{\"name\":\"marble1\",\"color\":\"blue\",\"size\":35,\"owner\":\"tom\",\"price\":99}" | base64 | tr -d \\n)
```

That way, the data you have to pass as transient, looks like this: `"{\"marble\":\"$MARBLE\"}"` it's a JSON with the content in base64.

## Main commands

### Install a smart contract with private data

```bash
hurl install marp golang --collections-config ../collections_config.json
```

### Invoke a smart contract with private data

```bash
# Build transient data
export MARBLE=$(echo -n "{\"name\":\"marble1\",\"color\":\"blue\",\"size\":35,\"owner\":\"tom\",\"price\":99}" | base64)

# Make invoke
hurl invoke marp initMarble -t "{\"marble\":\"$MARBLE\"}"
```

## Example - Native chaincode

Clone the official Fabric Samples https://github.com/hyperledger/fabric-samples/tree/release-1.4/

Go to the path `./chaincode/marbles02_private/` and change the policy (inside `collections_config.json`) to this:

```json
[
 {
   "name": "collectionMarbles",
   "policy": "OR('org1MSP.member', 'org2MSP.member')",
   "requiredPeerCount": 0,
   "maxPeerCount": 3,
   "blockToLive":1000000
},
 {
   "name": "collectionMarblePrivateDetails",
   "policy": "OR('org1MSP.member')",
   "requiredPeerCount": 0,
   "maxPeerCount": 3,
   "blockToLive":1000000
 }
]
```

> Understand the policy. Data in collection `collectionMarbles` is accessible by both peers (in org1 and org2) while data in `collectionMarblePrivateDetails` is just accessible by org 1. In this case, it's the price.

Now run:

```bash
# Enter to the folder with the source code ./fabric-samples/chaincode/marbles02_private/go
cd /chaincode/marbles02_private/go

# Important! Remember to install hurley before hand: `npm i -g @worldsibu/hurley`
# Install a network
hurl new

# Install the chaincode with a collection
hurl install marp golang --collections-config ../collections_config.json

# Build transient data
export MARBLE=$(echo -n "{\"name\":\"marble1\",\"color\":\"blue\",\"size\":35,\"owner\":\"tom\",\"price\":99}" | base64)

# Make a request passing transient data
hurl invoke marp initMarble -t "{\"marble\":\"$MARBLE\"}"

# A call that both orgs (org1 and org2) can read
hurl invoke marp readMarble "marble1"

# A call that just the org1 can access due to policy
hurl invoke marp readMarblePrivateDetails "marble1"
```

Checkout the data yourself: http://localhost:5184/_utils/#database

## Example - Convector

Here's a fully working example: https://github.com/worldsibu/convector-test-private-data