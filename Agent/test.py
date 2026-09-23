from pinecone import Pinecone, ServerlessSpec
import os

pc = Pinecone(api_key="pcsk_6Kj7Q_Qhb36WyiG9zXgDzeT3MeMtfvZLMmLzDC8zCBq5hrykC3D72ZszhRTXMtRASB78H")
index = pc.Index("langchainvector")
index.delete(delete_all=True)  