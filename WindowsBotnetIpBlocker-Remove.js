const { exec } = require('child_process')
const util = require('util')
const execPromisified = util.promisify(exec)

async function main() {
  // Delete all rules with name "BotnetIpBlocker"
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
    }
  }
}

main()
