from pydantic import BaseModel, Field


class AdminLoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class AdminUserOut(BaseModel):
    id: int
    username: str
    role: str

    model_config = {"from_attributes": True}


class AdminLoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminUserOut
