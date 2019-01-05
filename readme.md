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
hurley new

# Clean every blockchain network deployment component
hurley clean
```

## Details

### hurley new

Create a new blockchain network in your computer.

```bash
# New project
hurley new
    [-o -organizations <amount-of-organizations>]
    [-u -users <users-per-organization>]
    [-c -channels <amount-of-channels>]
    [-p -path <path-to-deploy >] # defaults to ~/Home/hyperledger-fabric-network
```

### hurley clean

Clear your environment from all the components.

```bash
hurley clean
```

## Roadmap 🗺

Have ideas? Post them in the [Issues section](https://github.com/worldsibu/hurley/issues).

## Important ⚗️

This project is currently under development and it's changing fast, but you can use it for your projects and if something doesn't work or would like new features provide feedback. We love community feedback!

Currently based on Fabric Samples from Hyperledger Fabric.

## Support

* For recommendations, feature requests, or bugs go to our [issues section](https://github.com/worldsibu/hurley/issues).
* News on Convector, hurley, or WorldSibu, subscribe to our [Newsletter](https://worldsibu.io/subscribe/).
* Need support? Chat directly with our team, join our [Discord](https://discord.gg/twRwpWt).