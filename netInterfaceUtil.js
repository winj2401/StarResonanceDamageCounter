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
        
        const defaultInterface = stdout.split('\n')
            .find(line => line.trim().startsWith('0.0.0.0'))
            ?.trim().split(/\s+/)[3];
        
        if (!defaultInterface) return null;
        
        const targetInterface = Object.entries(os.networkInterfaces())
            .find(([, interfaceList]) => 
                interfaceList.some(iface => 
                    !iface.internal && iface.family === 'IPv4' && iface.address === defaultInterface
                )
            )?.[0];
        
        if (!targetInterface) return null;

        const name = targetInterface.toLowerCase();
        if (['virtual', 'vethernet', 'tap', 'vpn', 'loopback'].some(v => name.includes(v))) {
            return null;
        }
        
        const isValidDevice = (desc, includeTerms = []) => {
            const excludeTerms = ['loopback', 'wan miniport', 'bluetooth', 'tap-windows', 'virtual', 'hyper-v'];
            return !excludeTerms.some(term => desc.includes(term)) && 
                   (includeTerms.length === 0 || includeTerms.some(term => desc.includes(term)));
        };
        
        const mappings = [
            { keywords: ['wi-fi', 'wireless'], caps: ['intel', 'wi-fi'] },
            { keywords: ['以太网', 'ethernet'], caps: ['realtek', 'gbe', 'ethernet'] }
        ];
        
        for (const mapping of mappings) {
            if (mapping.keywords.some(k => name.includes(k))) {
                const device = devices.find(d => isValidDevice(d.description.toLowerCase(), mapping.caps));
                if (device) return device;
            }
        }

        return null;

    } catch (error) {
        return null;
    }
}

module.exports = findDefaultNetworkDevice;