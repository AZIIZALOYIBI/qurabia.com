"""
╔════════════════════════════════════════════════════════════╗
║  GatingNetwork — بوابة عصبية للاختيار الذكي بين الخبراء  ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F


class GatingNetwork(nn.Module):
    """بوابة عصبية لاختيار أوزان الخبراء ديناميكياً."""

    def __init__(
        self,
        input_dim: int,
        n_experts: int,
        hidden_dim: int = 64,
        temperature: float = 1.0,
    ) -> None:
        super().__init__()
        self.n_experts = n_experts
        self.temperature = temperature
        self.gate = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim // 2, n_experts),
        )
        self.attention = nn.Sequential(
            nn.Linear(input_dim, input_dim),
            nn.Sigmoid(),
        )

    def forward(
        self, x: torch.Tensor,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        att = self.attention(x)
        x_att = x * att
        logits = self.gate(x_att)
        weights = F.softmax(logits / self.temperature, dim=-1)
        return weights, att
