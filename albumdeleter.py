#!/usr/bin/python
# -*- coding: utf-8 -*-
import ConfigParser
import sys

from common import get_input, config, smug_auth, album_select

s = smug_auth()
to_delete = album_select(s, config.get('smugmug', 'username'))

print("Delete albums:")
for a in to_delete:
    print("\t%s" % a['Title'])

print("Is this OK? Type 'delete' to continue")
val = get_input()
if val != 'delete':
    print("Aborting!")
    sys.exit(0)

for a in to_delete:
    sys.stdout.write("Deleting %s..." % (a['Title']))
    resp = s.albums_delete(AlbumID=a['id'])
    if resp['stat'] == 'ok':
        print("done")
    else:
        print("error")

print("All done.")
