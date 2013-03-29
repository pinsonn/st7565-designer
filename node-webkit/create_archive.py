#!/usr/bin/python
# build a .nw archive file for use with Node-Webkit
# will append files to the archive only if they do not already exist in the 
# archive. Probably need to change that.

import zipfile, os, sys, optparse

def addItem(zipfile, item):
	if os.path.isdir(item):
		for (archiveDirPath, dirNames, fileNames) in os.walk(item):
			for fileName in fileNames:
				filePath = os.path.join(archiveDirPath, fileName)
				if not fileName in zipfile.namelist():
					zipfile.write(filePath, filePath)
	else:
		if not item in zipfile.namelist():
			zipfile.write(item)


def main():
	p = optparse.OptionParser()
	p.add_option('--append', '-a',  action='store_true')
	p.add_option('--name', '-n', default="nw-archive")
	options, args = p.parse_args()
	if len(args):
		if options.append:
			zz = zipfile.ZipFile(options.name + ".nw", 'a')
		else: 
			zz = zipfile.ZipFile(options.name + ".nw",'w')

		if '*' in args:
			for item in os.listdir('.'):
				addItem(zz, item)
		else:
			for arg in args:
				addItem(zz, arg)	
		zz.close()
	else:
		print "No arguments provided. Archive not created."
		print "Type --help for more information on using this utility."

if __name__ == "__main__":
	main()


