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
child.sendline('cd /root/SYSTEMLEDMAPPINGPROJECT || cd /root/led-mapping || cd /home/SYSTEMLEDMAPPINGPROJECT || cd SYSTEMLEDMAPPINGPROJECT')
time.sleep(1)
child.sendline('git pull')
time.sleep(3)
child.sendline('docker compose up -d --build')

# Wait for 100 seconds to let docker finish building
for i in range(20):
    time.sleep(5)
    print(f"\nWaiting... {i * 5}s")

child.sendline('exit')
