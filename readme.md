# Hurley

Hurley is the **development environment toolset** for blockchain projects. It supports Hyperledger Fabric and is being ported to support other chain technologies.

It is an open source project under an Apache 2.0 license to help you create Convector projects easily.

## Prerequisites

* [Node](https://nodejs.org/en/download/) 8.11.0 (other versions might work, but this is the one we use for development)
* [Docker](https://www.docker.com/community-edition)

## Usage

```bash
npm i -g @worldsibu/hurley
```

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
    [-o -organizations <amount-of-organizations>]
    [-u -users <users-per-organization>]
    [-c -channels <amount-of-channels>]
    [-p -path <path-to-deploy >] # defaults to $HOME/hyperledger-fabric-network
```

### hurl clean

Clear your environment from all the components.

```bash
hurl clean
```

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

## Important ⚗️

This project is currently under development and it's changing fast, but you can use it for your projects and if something doesn't work or would like new features provide feedback. We love community feedback!

Currently based on Fabric Samples from Hyperledger Fabric.

## Support

* For recommendations, feature requests, or bugs go to our [issues section](https://github.com/worldsibu/hurley/issues).
* News on Convector, hurley, or WorldSibu, subscribe to our [Newsletter](https://worldsibu.io/subscribe/).
* Need support? Chat directly with our team, join our [Discord](https://discord.gg/twRwpWt).