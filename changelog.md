# Changelog

## 1.0.0 (03-18-2019)

* Private data support for Convector and non-Convector smart contracts ([details](https://github.com/worldsibu/hurley/blob/develop/privatedata.md))
  * V3 Fabric capabilities enabled.
  * Install and upgrade chaincodes with collections config.
  * Invoke with transient data.
* Debugging for NodeJS smart contracts.
* Improved logs for partially successful requests (like private data).

## 0.5.1 (02-17-2019)

* Invoke tasks can use a different user and organization through `-u` and `-o` optional params.
* If something happens running scripts, it won't silently fail anymore.
* IMPORTANT: Invoke Params breaking change.
