# Changelog

## 2025-08-12
### Fixed
- Reset both difficulties on game reset. ([`1f35c47`](https://github.com/campbell-rehu/kia-tere/commit/1f35c476c053628005d6a34db02950d811fd302c))

## 2025-08-10
### Added
- Distinguish disconnects from players intentionally leaving rooms. ([`0577c22`](https://github.com/campbell-rehu/kia-tere/commit/0577c225230024c9e1d3d37f8fd05253219cfe85))
- Add keyboard controls for gameplay. ([`a6643d2`](https://github.com/campbell-rehu/kia-tere/commit/a6643d25ed1e7045c81cd891d066a34278b1c72b))
- Allow custom turn duration. ([`d736601`](https://github.com/campbell-rehu/kia-tere/commit/d7366017d2e9c91dd89c7a1c5061eb61c6399855))

## 2025-08-09
### Added
- Add game state notifications for selections, eliminations and wins. ([`345b13d`](https://github.com/campbell-rehu/kia-tere/commit/345b13d210cf888cbb58c62e53efb25103688d12))
### Fixed
- Prevent category reuse and expand category list. ([`f165a29`](https://github.com/campbell-rehu/kia-tere/commit/f165a29db9f64aea50e2fafafb0c113110ceeb1f))

## 2025-08-08
### Added
- Allow hosts to refresh category. ([`1c69e72`](https://github.com/campbell-rehu/kia-tere/commit/1c69e722839427cc5e9361759c0a948f9a1c8a07))

## 2025-06-06
### Added
- Implement progressive overtime rounds with escalating requirements. ([`ff40b8f`](https://github.com/campbell-rehu/kia-tere/commit/ff40b8f380649018bf58423b7450b6a550669dfc))
### Fixed
- Simplify WebSocket URL configuration logic. ([`6e7bdd1`](https://github.com/campbell-rehu/kia-tere/commit/6e7bdd17c9442bf83c7812dc460d8bba9b58dccf))

## 2025-06-05
### Added
- Add custom favicon and improved web app manifest. ([`f7be6b8`](https://github.com/campbell-rehu/kia-tere/commit/f7be6b8b3cd57dbeae71458c0862e495ba07ef64))
### Fixed
- Resolve room joining race condition. ([`79d832a`](https://github.com/campbell-rehu/kia-tere/commit/79d832a4a5915051b62cb2fc2754909af5aa7b19))
- Handle staging environment and correct room creation timing. ([`149e849`](https://github.com/campbell-rehu/kia-tere/commit/149e8492adeb0a1f3f10b59cd3f8a0f6cb95b973))

## 2025-06-04
### Fixed
- Unset port on WebSocket server. ([`01abe96`](https://github.com/campbell-rehu/kia-tere/commit/01abe96842f8b8deca465b653827c740aa061572))
- Use GAME_CONSTANTS.WS_URL for WebSocket endpoint. ([`937bc4b`](https://github.com/campbell-rehu/kia-tere/commit/937bc4bb6408d8230d61ea91d56271c87f5a003b))

## 2025-06-03
### Fixed
- Use localhost instead of IP address. ([`ad9f689`](https://github.com/campbell-rehu/kia-tere/commit/ad9f689a09661ac386f1681fab5502244d35206c))

## 2025-06-01
### Fixed
- Fix timer issues. ([`99771eb`](https://github.com/campbell-rehu/kia-tere/commit/99771eb380242c5ce6d18572ea261cbdf792dbd0))

## 2025-05-31
### Added
- Allow setting game difficulty. ([`35f1f6d`](https://github.com/campbell-rehu/kia-tere/commit/35f1f6df37f09a2908b0db17618d7fe838ce5efd))
### Fixed
- Fix difficulty issues. ([`3907beb`](https://github.com/campbell-rehu/kia-tere/commit/3907bebf430fcbf9c0fa991fc04f306e6d1184af))

## 2025-05-30
### Fixed
- Improve error handling and support LAN WebSocket connections. ([`f653a1c`](https://github.com/campbell-rehu/kia-tere/commit/f653a1c4d4cbcaf813b830d6b5487ca571724c71))
