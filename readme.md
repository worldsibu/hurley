# Hurley

Hurley is the **development environment toolset** for Enterprise Blockchain projects. It supports Hyperledger Fabric and is being ported to support other chain technologies.

It is an open source project under an Apache 2.0 license to help you create Convector projects easily.

## Prerequisites

* NPM
* [Docker](https://www.docker.com/community-edition)

## Usage

```bash
npm i -g @worldsibu/hurley
```

### Upgrade

```bash
npm upgrade -g @worldsibu/hurley
```

### Get Version

Get the version of your Hurley installation.

```bash
hurl --version
```

Hurley deploys Hyperledger Fabric 1.4.0 networks.

### Basic network management

```bash
# Start a new blockchain network with 2 organizations, 2 users per organization, and 1 channel, localted at ~/Home/hyperledger-fabric-network
hurl new

# Clean every blockchain network deployment component
hurl clean
```

## Details

### hurl new

Create a new blockchain network in your computer. The first time you execute it, Hurley will check for Hyperledger Fabric's binaries and Container Images.

```bash
# New project
hurl new
    [-o --organizations <amount-of-organizations>]
    [-u --users <users-per-organization>]
    [-c --channels <amount-of-channels>]
    [-p --path <path-to-install-the-network>]
    [-i --inside] # Whether or not the `hurl` command will runs inside the same Docker network where the blockchain was provisioned
```

### hurl clean

Clear your environment from all the components.

```bash
hurl clean
    [-R --no-rmi] # Ask `hurl` to not delete the container images
```

### hurl install

Hurley handles the lifecycle of your chaincodes through `install` and `upgrade` commands.

Be sure to run `hurl install` inside the folder with the source code you want to install.

```bash
hurl install <chaincode> <language> 
    [-p --path <path-to-install-the-network>]
    [-C --channel <channel>] # Defaults to ch1. Use example: "-C ch1 -C ch2 -C ch3"
    [-c --ctor <constructor>] # The constructor for the install function. Defaults to ' {"Args":["init",""]}'
    [-x, --collections-config <collections-config>] # Collections config file path (private data
    [-P --chaincode-path <path>] # Path to chaincode package. Default to ./<chaincode>
    [-i --inside] # Whether or not the `hurl` command will runs inside the same Docker network where the blockchain was provisioned
    [-d --debug] # Runs the chaincode in debug mode, it doesn't start a container, instead it runs the process in your host machine. This is only available for Nodejs chaincodes for now, it will invoke `npm run start:debug`
```

Language options:

* node
* golang

### hurl upgrade

Be sure to run `hurl upgrade` inside the folder with the source code you want to install.

```bash
hurl upgrade <chaincode> <language> <version>
    [-p --path <path-to-install-the-network>]
    [-C --channel <channel>] # Defaults to ch1. Use example: "-C ch1 -C ch2 -C ch3"
    [-c --ctor <**constructor**>] # The constructor for the install function. Defaults to '{"Args":["init",""]}'
    [-x, --collections-config <collections-config>] # Collections config file path (private data
    [-P --chaincode-path <path>] # Path to chaincode package. Default to ./<chaincode>
    [-i --inside] # Whether or not the `hurl` command will runs inside the same Docker network where the blockchain was provisioned
```

Language options:

* node
* golang
* If you are using <a href="https://github.com/worldsibu/convector" target="_blank">Convector Smart Contracts</a> be sure to package first the code through `npm run cc:package -- <your-chaincode> org1`

### hurl invoke

You don't to be in any specific folder path, you just need the name of the chaincode.

```bash
hurl invoke <chaincode> <fn>  [args...]
    [-p --path <path-where-you-installed-the-network>]
    [-t, --transient-data <transient-data>] # Private data, must be BASE64 https://hyperledger-fabric.readthedocs.io/en/release-1.4/private_data_tutorial.html#store-private-data
    [-u, --user <user>] # Select an specific user to execute command. Default user1
    [-o, --organization <organization>] # Select a specific organisation to execute the command. Default org1
    [-C --channel <channel>] # Defaults to ch1
    [-i --inside] # Whether or not the `hurl` command will runs inside the same Docker network where the blockchain was provisioned
```

The main parameters here are `<chaincode>`, `<fn>`, and [args...] where [args...] is an array of params separated by a blank space, for example:

For Non-Convector-JS based chaincode methods

* `hurl invoke example02 invoke "walter" "diego" "99"`
* `hurl invoke example02 query "walter"`

For Convector-JS based chaincode methods

* `hurl invoke exampleconv exampleconv_beautifulMethod "walter" "diego" "99"`
* `hurl invoke exampleconv exampleconv_beautifulQuery "walter"`

> Note the prepending of the chaincode (controller) name in the `<fn>` param.

## Private Data

In recent versions of Hyperledger Fabric, it's now possible to handle [private collections of data](https://hyperledger-fabric.readthedocs.io/en/release-1.4/private_data_tutorial.html).

Read [here more](https://github.com/worldsibu/hurley/blob/develop/privatedata.md) how to configure smart contracts with private data, and how to make calls to it.

## Integrate to your development flow

Everything you need will be hosted in the Network Folder (default `$HOME/hyperledger-fabric-network`). You can use all the files in this folder to consume the network, whether in your machine or in a Docker container.

### Crypto materials for your users

All the certificates and Application files for your default users reside in `$HOME/hyperledger-fabric-network/.hfc-*`.

### Network profiles

Your network profiles will be provisioned at `$HOME/hyperledger-fabric-network/network-profiles`.

* The `*.network-profile.yaml` files: map your network if you run outside of the Docker network. For example, straight from your Machine.
* The `*.network-profile.inside-docker.yaml` files: map your network if you run an application inside a docker container in the same network as the blockchain `hurley_dev_net`.

## Roadmap 🗺

Have ideas? Post them in the [Issues section](https://github.com/worldsibu/hurley/issues).

Some ideas for future releases:

* Hyperledger version select.
* Support Hyperledger Sawtooth.

## Changelog

[Go to changelog](https://github.com/worldsibu/hurley/blob/develop/changelog.md)

## Important ⚗️

This project is currently under development and it's changing fast, but you can use it for your projects and if something doesn't work or would like new features provide feedback. We love community feedback!

Currently based on Fabric Samples from Hyperledger Fabric.

## Support

* [Product Hunt profile](https://www.producthunt.com/posts/hurley)
* For recommendations, feature requests, or bugs go to our [issues section](https://github.com/worldsibu/hurley/issues).
* News on Convector, hurley, or WorldSibu, subscribe to our [Newsletter](https://worldsibu.io/subscribe/).
* Need support? Chat directly with our team, join our [Discord](https://discord.gg/twRwpWt).
