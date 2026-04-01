"""
🧬 GENESIS v4.0 — النظام الكامل المتكامل
بيانات حقيقية → هندسة خصائص → تطور متقدم → مزيج خبراء → مراقبة → واجهة
"""

from genesis_v4.data_loader import RealDataLoader
from genesis_v4.feature_engineer import AutoFeatureEngineer
from genesis_v4.algorithm_dna import AlgorithmDNA, DNAFactory
from genesis_v4.surrogate import SurrogateModel
from genesis_v4.multi_objective import MultiObjectiveFitness
from genesis_v4.evolution import EvolutionEngineV3, CheckpointManager
from genesis_v4.gating import GatingNetwork
from genesis_v4.mixture_of_experts import MixtureOfExperts
from genesis_v4.self_monitor import SelfMonitor
from genesis_v4.genesis_system import GENESISv4

__version__ = "4.0.0"

__all__ = [
    "RealDataLoader",
    "AutoFeatureEngineer",
    "AlgorithmDNA",
    "DNAFactory",
    "SurrogateModel",
    "MultiObjectiveFitness",
    "EvolutionEngineV3",
    "CheckpointManager",
    "GatingNetwork",
    "MixtureOfExperts",
    "SelfMonitor",
    "GENESISv4",
]
