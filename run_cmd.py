import pexpect
import sys

print("Checking remote directory...")
cmd = 'ssh -o StrictHostKeyChecking=no root@185.185.80.228 "find / -maxdepth 3 -type d -name \\"*LED*\\" -o -name \\"*led*\\" 2>/dev/null"'
child = pexpect.spawn(cmd, encoding='utf-8')
child.logfile = sys.stdout

i = child.expect(['assword:', 'password:', 'Password:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
if i < 3:
    child.sendline('F4b1oPr15ss1L4')
    child.expect(pexpect.EOF, timeout=120)
print("\nDone!")
