import pexpect
import sys

print("Connecting to VPS...")
child = pexpect.spawn('ssh -o StrictHostKeyChecking=no root@185.185.80.228', encoding='utf-8', timeout=300)
child.logfile = sys.stdout

try:
    i = child.expect(['assword:', 'password:', 'Password:', pexpect.EOF, pexpect.TIMEOUT])
    if i < 3:
        child.sendline('F4b1oPr15ss1L4')
    
    # Wait for prompt
    child.expect(['#', '\$'])
    print("\n[+] Logged in successfully!")

    child.sendline('cd SYSTEMLEDMAPPINGPROJECT')
    child.expect(['#', '\$'])
    
    print("\n[+] Pulling from git...")
    child.sendline('git pull')
    child.expect(['#', '\$'])
    
    print("\n[+] Rebuilding and starting docker...")
    child.sendline('docker compose up -d --build')
    child.expect(['#', '\$'])
    
    print("\n[+] Done!")
    child.sendline('exit')
    child.expect(pexpect.EOF)
except Exception as e:
    print(f"\n[-] Error: {e}")
