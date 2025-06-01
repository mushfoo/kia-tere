# Makefile for Kia Tere project

.PHONY: client server start client-test server-test lint-check format-check check fix

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

# Linting and formatting targets
lint-check:
	cd client && npm run lint:check
	cd server && npm run lint:check

format-check:
	cd client && npm run format:check
	cd server && npm run format:check

check: lint-check format-check

fix:
	cd client && npm run fix
	cd server && npm run fix
