# Makefile for Kia Tere project

.PHONY: client server start

client:
	cd client && npm start

server:
	cd server && npm run dev

start:
	make -j2 client server