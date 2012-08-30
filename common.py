#!/usr/bin/python
# -*- coding: utf-8 -*-
import ConfigParser
import sys

from smugpy import SmugMug

config = ConfigParser.ConfigParser()
try:
    config.readfp(open('secrets.cfg'))
except e:
    print(e.msg)

# Smooth over python 2->3 differences
if sys.version_info < (3,):
    get_input = raw_input
else:
    get_input = input

def save():
    with open('secrets.cfg', 'wb') as configfile:
        config.write(configfile)

def smug_auth():
    smugmug = SmugMug(api_key=config.get('smugmug', 'key'), oauth_secret=config.get('smugmug', 'secret'), api_version="1.3.0", app_name="flickr-to-smugmug")
    if config.has_option('smugmug', 'oauth_token'):
        smugmug.set_oauth_token(config.get('smugmug', 'oauth_token'), config.get('smugmug', 'oauth_token_secret'))
    else:
        smugmug.auth_getRequestToken()
        get_input("Authorize app at %s\n\nPress Enter when complete.\n" % (smugmug.authorize(access='Full', perm='Modify')))
        smugmug.auth_getAccessToken()
        config.set('smugmug', 'oauth_token', smugmug.oauth_token)
        config.set('smugmug', 'oauth_token_secret', smugmug.oauth_token_secret)
        save()
    return smugmug

def album_select(smug, user):
    albums = smug.albums_get(NickName=user)['Albums']
    msg = ''
    while True:
        for i, a in enumerate(albums):
            print("%-3s (%s) %s" % (i, '*' if a.get('toggled', False) else ' ', a['Title']))

        print("\nType number to toggle album for deletion. Type 'A' to select all. Enter when finished.")
        print(msg)

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
                msg = "Input a number"
            try:
                albums[index]['toggled'] = not albums[index].get('toggled', False)
            except IndexError:
                msg = "Input number between 0 and %s" % len(albums)
        msg = ''

    return filter(lambda a: a.get('toggled', False), albums)


