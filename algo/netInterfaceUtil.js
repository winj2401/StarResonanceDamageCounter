const os = require('os');
const { exec } = require('child_process');

async function findDefaultNetworkDevice(devices) {
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

        const targetInterface = Object.entries(devices).find(([, device]) =>
            device.addresses.find((address) => address.addr === defaultInterface),
        )?.[0];

        return targetInterface;
    } catch (error) {
        return undefined;
    }
}

module.exports = findDefaultNetworkDevice;
