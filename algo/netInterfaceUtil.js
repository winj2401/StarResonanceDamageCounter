const { exec } = require('child_process');
const cap = require('cap');

// Filter virtual adapters
const VIRTUAL_KEYWORDS = ['zerotier', 'vmware', 'hyper-v', 'virtual', 'loopback', 'tap', 'bluetooth', 'wan miniport'];

function isVirtual(name) {
    const lower = name.toLowerCase();
    return VIRTUAL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

// Detect TCP traffic for 3 seconds
function detectTraffic(deviceIndex, devices) {
    return new Promise((resolve) => {
        let count = 0;
        try {
            const c = new cap.Cap();
            const buffer = Buffer.alloc(65535);

            const cleanup = () => {
                try {
                    c.close();
                } catch (e) {}
            };

            setTimeout(() => {
                cleanup();
                resolve(count);
            }, 20000);

            if (c.open(devices[deviceIndex].name, 'ip and tcp', 1024 * 1024, buffer) === 'ETHERNET') {
                c.setMinBytes && c.setMinBytes(0);
                c.on('packet', () => count++);
            } else {
                cleanup();
                resolve(0);
            }
        } catch (e) {
            resolve(0);
        }
    });
}

async function findByRoute(devices) {
    try {
        const stdout = await new Promise((resolve, reject) => {
            exec('route print 0.0.0.0', (error, stdout) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });

        const defaultInterface = stdout
            .split('\n')
            .find((line) => line.trim().startsWith('0.0.0.0'))
            ?.trim()
            .split(/\s+/)[3];

        if (!defaultInterface) return undefined;

        const targetInterface = Object.keys(devices).find((key) =>
            devices[key].addresses.find((address) => address.addr === defaultInterface)
        );

        if (!targetInterface) {
            return undefined;
        }

        return parseInt(targetInterface, 10);
    } catch (error) {
        console.error('Failed to find device by route:', error);
        return undefined;
    }
}

async function findDefaultNetworkDevice(devices) {
    console.log('Auto detecting default network interface via route table...');
    try {
        const routeIndex = await findByRoute(devices);

        if (routeIndex !== undefined) {
            console.log(`Using adapter from route table: ${routeIndex} - ${devices[routeIndex].description}`);
        } else {
            console.log('Could not find a default network interface via route table.');
        }

        return routeIndex;
    } catch (error) {
        console.error(
            'An error occurred during device lookup. Please ensure your system is properly configured.',
            error
        );
        return undefined;
    }
}

module.exports = findDefaultNetworkDevice;
