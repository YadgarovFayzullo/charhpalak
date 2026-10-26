"""tournament page views with anti-abuse log

Revision ID: b7c1d2e3f401
Revises: ec07329a8464
Create Date: 2026-10-27 12:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = 'b7c1d2e3f401'
down_revision = 'ec07329a8464'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('tournament_views',
    sa.Column('slug', sa.String(length=64), nullable=False),
    sa.Column('total', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('slug')
    )
    op.create_table('tournament_view_hits',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('slug', sa.String(length=64), nullable=False),
    sa.Column('visitor', sa.String(length=64), nullable=False),
    sa.Column('seen_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_view_hits_slug_visitor', 'tournament_view_hits', ['slug', 'visitor'])
    op.create_index('ix_view_hits_visitor_seen', 'tournament_view_hits', ['visitor', 'seen_at'])
    op.create_index(op.f('ix_tournament_view_hits_seen_at'), 'tournament_view_hits', ['seen_at'])


def downgrade() -> None:
    op.drop_table('tournament_view_hits')
    op.drop_table('tournament_views')
