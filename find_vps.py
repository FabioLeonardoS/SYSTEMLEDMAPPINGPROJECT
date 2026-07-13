import pexpect
import time
import sys

print("Connecting...")
child = pexpect.spawn('ssh -o StrictHostKeyChecking=no root@185.185.80.228', encoding='utf-8')
child.logfile = sys.stdout

time.sleep(3)
child.sendline('F4b1oPr15ss1L4')
time.sleep(3)

print("\n--- Running commands ---")
child.sendline('ls -la')
time.sleep(2)
child.sendline('find / -name "SYSTEMLEDMAPPINGPROJECT" -type d 2>/dev/null')
time.sleep(5)
child.sendline('exit')
