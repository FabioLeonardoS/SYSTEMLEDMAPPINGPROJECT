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
    
    child.sendline('find / -maxdepth 3 -type d -name "*LED*" -o -name "*led*" -o -name "*MAPPING*" 2>/dev/null')
    child.expect_exact('#')
    
    child.sendline('exit')
    child.expect(pexpect.EOF)
except Exception as e:
    print(f"\n[-] Error: {e}")
