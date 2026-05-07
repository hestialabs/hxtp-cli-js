# hxtp-cli (Node.js)

The official Node.js command-line interface for **HxTP/3.1** infrastructure management.

## 🚀 Installation

Install globally via npm or bun:

```bash
npm install -g hxtp-cli
# or
bun install -g hxtp-cli
```

## 🔐 Authentication

Login to your HestiaLabs account to securely store credentials:

```bash
hxtp-cli login
```

## 📡 Command Dispatch

Send signed HxTP commands to devices with sub-millisecond latency.

### REST Transport (Default)
```bash
hxtp-cli send <device_id> <action> --params '{"key": "value"}'
```

### MQTT Transport
Native protocol-bound dispatch directly to the broker:

```bash
hxtp-cli send <device_id> <action> --transport mqtt --params '{"key": "value"}'
```

## 🛠️ Global Options

| Option | Description |
| :--- | :--- |
| `--transport <type>` | Toggle between `rest` (default), `mqtt`, and `ws`. |
| `--config <path>` | Path to custom configuration file. |
| `--verbose` | Enable debug logging. |

## 🛡️ HxTP/3.1 Support
This CLI is fully synchronized with the HxTP/3.1 protocol stack:
- **Bit-Perfect Signing**: Uses the `@hestialabs/hxtp-js` SDK for canonicalization.
- **Credential Storage**: Securely manages `clientId`, `deviceId`, and `secret`.
- **Deterministic Numbers**: Full 20-place decimal precision for numeric parameters.
