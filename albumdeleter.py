#!/usr/bin/python
# -*- coding: utf-8 -*-
import ConfigParser
import sys

from common import get_input, config, smug_auth

s = smug_auth()
albums = s.albums_get(NickName=config.get('smugmug', 'username'))['Albums']

while True:
    for i, a in enumerate(albums):
        print("%-3s (%s) %s" % (i, '*' if a.get('toggled', False) else ' ', a['Title']))

    print("\nType number to toggle album for deletion. Type 'A' to select all. Enter when finished.")

    index = get_input()
    if index == 'A':
        for i, a in enumerate(albums):
            albums[i]['toggled'] = not albums[i].get('toggled', False)
    elif len(index) == 0:
        break
    else:
        try:
            index = int(index)
        except ValueError:
            print("Input a number")
        try:
            albums[index]['toggled'] = not albums[index].get('toggled', False)
        except IndexError:
            print("Input number between 0 and %s" % len(albums))

to_delete = filter(lambda a: a.get('toggled', False), albums)
if len(to_delete) == 0:
    print("Nothing to do.")
    sys.exit(0)

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
