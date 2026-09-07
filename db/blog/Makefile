.POSIX:
.PHONY: help deploy revert verify reset

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  help    Show this help message"
	@echo "  deploy  Deploy the blog database"
	@echo "  revert  Revert the last change"
	@echo "  verify  Verify the blog database"
	@echo "  reset   Reset the blog database"

deploy:
	sqitch deploy --target local

revert:
	sqitch revert --target local -y

verify:
	sqitch verify --target local

reset:
	rm -f ../blog.sqlite ../blog.sqlite-wal ../blog.sqlite-shm ../sqitch.db ../sqitch.sqlite
	$(MAKE) deploy
