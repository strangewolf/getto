"""stock transfers (UC8)

Revision ID: 002_transfers
Revises: 001_initial
"""

from typing import Sequence, Union

from alembic import op

from app.models.transfers import StockTransfer, StockTransferLine

revision: str = "002_transfers"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    StockTransfer.__table__.create(bind=bind, checkfirst=True)
    StockTransferLine.__table__.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    StockTransferLine.__table__.drop(bind=bind, checkfirst=True)
    StockTransfer.__table__.drop(bind=bind, checkfirst=True)
