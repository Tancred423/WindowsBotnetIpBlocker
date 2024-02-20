// Import the required modules
const https = require('https')
const { exec } = require('child_process')
const util = require('util')
const execPromisified = util.promisify(exec)

// URL of the IP blocklist
const ipBlocklistUrl = 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt'

// Function to make a https.get return a promise
const getIpBlocklist = () => {
  return new Promise((resolve, reject) => {
    https
      .get(ipBlocklistUrl, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          resolve(data)
        })
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

async function main() {
  try {
    const data = await getIpBlocklist()

    // Regular expression to match IP addresses
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/gm

    // Split the data by newline, filter out empty lines and comments, and match the remaining lines against the IP regex
    const ipList = data
      .split('\n')
      .filter((line) => line.trim() !== '' && !line.startsWith('#'))
      .filter((line) => ipRegex.test(line))

    // If there are no IP addresses in the list, log a message and exit
    if (ipList.length === 0) {
      console.log('No valid IP addresses found in the blocklist')
      return
    }

    // First delete all rules with name "BotnetIpBlocker"
    try {
      await execPromisified(
        'powershell -Command "Remove-NetFirewallRule -DisplayName BotnetIpBlocker"',
      )
      console.log('Firewall rules removed successfully')
    } catch (error) {
      // No not throw error if the rules do not exist
      if (
        !error.message.includes(
          "No MSFT_NetFirewallRule objects found with property 'DisplayName' equal to 'BotnetIpBlocker'.",
        )
      ) {
        console.error(`Failed to remove firewall rules: ${error.message}`)
        console.error('Exiting...')
        return
      }
    }

    // If there are any IP addresses in the list, create a new firewall rule to block them
    for (const ip of ipList) {
      // Outbound
      const firewallRuleOutbound = `New-NetFirewallRule -DisplayName "BotnetIpBlocker" -RemoteAddress "${ip}" -Direction Outbound -Action Block`

      try {
        await execPromisified(`powershell -Command "${firewallRuleOutbound}"`)
        console.log('Outbound firewall rule added successfully for IP: ' + ip)
      } catch (error) {
        console.error('Failed to add firewall rule: ' + error.message)
      }

      // Inbound
      const firewallRuleInbound = `New-NetFirewallRule -DisplayName "BotnetIpBlocker" -RemoteAddress "${ip}" -Direction Inbound -Action Block`

      try {
        await execPromisified(`powershell -Command "${firewallRuleInbound}"`)
        console.log('Inbound  firewall rule added successfully for IP: ' + ip)
      } catch (error) {
        console.error('Failed to add firewall rule: ' + error.message)
      }
    }
  } catch (error) {
    console.error('Failed to fetch IP blocklist:' + error.message)
  }
}

main()
