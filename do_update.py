import pexpect
import sys

print("Connecting...")
child = pexpect.spawn('ssh -o StrictHostKeyChecking=no root@185.185.80.228', encoding='utf-8')
child.logfile = sys.stdout

i = child.expect(['password:', 'Password:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
if i < 2:
    child.sendline('F4b1oPr15ss1L4')

try:
    child.expect_exact('#')
    print("\n--- Logged in! ---")
    
    child.sendline('cd /root/SYSTEMLEDMAPPINGPROJECT')
    child.expect_exact('#')
    
    child.sendline('git pull')
    child.expect_exact('#', timeout=30)
    
    child.sendline('docker compose up -d --build')
    # wait up to 5 minutes for docker
    child.expect_exact('#', timeout=300)
    
    child.sendline('exit')
    child.expect(pexpect.EOF)
except Exception as e:
    print(f"\n[-] Error: {e}")
