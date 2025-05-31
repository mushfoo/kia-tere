# Makefile for Kia Tere project

.PHONY: client server start

client:
	cd client && npm start

server:
	cd server && npm run dev

client-test:
	cd client && npm test

server-test:
	cd server && npm test

start:
	make -j2 client server
